import type { Writable } from 'stream';
import { logger as log } from './logger';
import { makeError, makeTicket } from './parser';
import type { IAmCamera, IAmDispatcher, Plate } from './parser';

type RecordMeta = Plate & IAmCamera & { day: number };
type SocketWithId = Writable & { _id?: string };

const cameraMeta: Map<SocketWithId, IAmCamera> = new Map();
const camerasByRoad: Map<number, [IAmCamera, SocketWithId][]> = new Map();
const dispatcherMeta: Map<SocketWithId, IAmDispatcher> = new Map();
const dispatchersByRoad: Map<number, SocketWithId[]> = new Map();
const recordsByPlate: Map<string, RecordMeta[]> = new Map();
const ticketCache: Map<number, [RecordMeta, RecordMeta, number][]> = new Map();
const sentTickets: Map<string, Set<number>> = new Map();

export function handleDisconnect(socket: SocketWithId) {
  const cMeta = cameraMeta.get(socket);

  if (cMeta) {
    cameraMeta.delete(socket);
    const list = camerasByRoad.get(cMeta.road) || [];

    for (let i = list.length; i > -1; i -= 1) {
      if (list[i]?.[1] === socket) {
        list.splice(i, 1);
        break;
      }
    }
  }

  const dMeta = dispatcherMeta.get(socket);

  if (dMeta) {
    dispatcherMeta.delete(socket);

    for (const road of dMeta.roads) {
      const list = dispatchersByRoad.get(road) || [];

      for (let i = list.length; i > -1; i -= 1) {
        if (list[i] === socket) {
          list.splice(i, 1);
          break;
        }
      }
    }
  }
}

export function handleError(msg: string, socket: SocketWithId) {
  log.error(socket._id, 'error response', msg);
  socket.write(makeError(msg));
  socket.destroy();
}

export function handleIAmCamera(msg: IAmCamera, socket: SocketWithId) {
  log.info(socket._id, 'iAmCamera', msg.road, msg.mile, msg.limit);

  if (cameraMeta.has(socket) || dispatcherMeta.has(socket)) {
    return handleError('duplicate "iAmCamera" message', socket);
  }

  let list = camerasByRoad.get(msg.road);

  if (!list) {
    list = [];
    camerasByRoad.set(msg.road, list);
  }

  list.push([msg, socket]);
  list.sort(([a], [b]) => b.mile - a.mile);

  cameraMeta.set(socket, msg);

  log.info(socket._id, 'camera added', msg.road, msg.mile, msg.limit);
}

export function handleIAmDispatcher(msg: IAmDispatcher, socket: SocketWithId) {
  log.info(socket._id, 'iAmDispatcher', ...msg.roads);

  if (cameraMeta.has(socket) || dispatcherMeta.has(socket)) {
    return handleError('duplicate "iAmDispatcher" message', socket);
  }

  for (const road of msg.roads) {
    let list = dispatchersByRoad.get(road);

    if (!list) {
      list = [];
      dispatchersByRoad.set(road, list);
    }

    list.push(socket);

    log.info(socket._id, 'dispatcher added', road, list.length);

    const tickets = ticketCache.get(road);

    if (tickets) {
      ticketCache.delete(road);

      for (const ticket of tickets) {
        sendTicket(...ticket);
      }
    }
  }

  dispatcherMeta.set(socket, msg);
}

export function handlePlate(msg: Plate, socket: SocketWithId) {
  log.info(socket._id, 'plate', msg.plate, msg.timestamp);

  const cMeta = cameraMeta.get(socket);

  if (!cMeta) {
    return handleError('not a camera', socket);
  }

  const { plate, timestamp } = msg;
  const { limit, mile, road } = cMeta;
  const day = Math.floor(timestamp / 86400);

  if (sentTickets.get(plate)?.has(day)) {
    log.info('ticket limit reached for', plate, day);
    return;
  }

  const list = (recordsByPlate.get(plate) || []).slice(-1).concat({
    day,
    limit,
    mile,
    plate,
    road,
    timestamp,
  });

  list.sort((a, b) => a.timestamp - b.timestamp);
  recordsByPlate.set(plate, list);

  const [r1, r2] = list;

  if (r1.road !== r2?.road) {
    return;
  }

  const speed =
    Math.abs(r2.mile - r1.mile) / ((r2.timestamp - r1.timestamp) / 3600);

  if (speed > r1.limit + 0.5) {
    recordsByPlate.delete(plate);
    sendTicket(r1, r2, speed);
  }
}

function sendTicket(r1: RecordMeta, r2: RecordMeta, speed: number) {
  const socket = (dispatchersByRoad.get(r1.road) || [])[0];

  if (socket) {
    socket.write(
      makeTicket(
        r1.plate,
        r1.road,
        r1.mile,
        r1.timestamp,
        r2.mile,
        r2.timestamp,
        speed * 100
      )
    );

    log.info(
      socket._id,
      'ticket issued',
      r1.plate,
      r1.road,
      speed,
      r1.day,
      r2.day
    );

    let tickets = sentTickets.get(r1.plate);

    if (!tickets) {
      tickets = new Set();
      sentTickets.set(r1.plate, tickets);
    }

    tickets.add(r1.day);
    tickets.add(r2.day);
  } else {
    let list = ticketCache.get(r1.road);

    if (!list) {
      list = [];
      ticketCache.set(r1.road, list);
    }

    list.push([r1, r2, speed]);
    log.info('ticket deferred', r1.plate, r1.road, speed);
  }
}

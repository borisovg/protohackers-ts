import { LineReverser } from './line-reverser';
import { LrcpServer } from './lrcp-server';
import type { LrcpSession } from './lrcp-session';

new LrcpServer()
  .on('session', (session: LrcpSession) => {
    session.pipe(new LineReverser()).pipe(session);
  })
  .listen(10123);

import { Parser } from './Parser';

const parser = new Parser();

parser.on('insert', (...args) => console.log('INSERT', ...args));

parser.write(Buffer.from([73]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([1]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([2]));

parser.write(Buffer.from([73]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([1]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([2]));

parser.write(Buffer.from([73]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([1]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([0]));
parser.write(Buffer.from([2]));

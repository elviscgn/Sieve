import { EventEmitter } from "events";

// Initializes and exports a singleton EventEmitter instance used to broadcast and listen to application-wide real-time events.
const globalEmitter = new EventEmitter();

export default globalEmitter;
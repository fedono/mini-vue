import { isArray } from '../shared';

const queue = [];
const activePreFlushCbs = [];

let flushIndex = 0;

const pendingPostFlushCbs = [];
let activePostFlushCbs = null;
let postFlushIndex = 0;

const p = Promise.resolve();
let isFlushPending = false;

function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

export function queueJob(job) {
  if (!queue.include(job)) {
    queue.push(job);

    queueFlush();
  }
}

function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
}

function flushJobs() {
  isFlushPending = false;

  flushPreFlushCbs();
}

export function queuePostFlushCb(cb) {
  if (!isArray(cb)) {
    if (
      !activePostFlushCbs ||
      !activePostFlushCbs.includes(cb, cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex)
    ) {
      pendingPostFlushCbs.push(cb);
    }
  } else {
    pendingPostFlushCbs.push(...cb);
  }

  queueFlush();
}

function flushPreFlushCbs() {
  for (let i = 0; i < activePreFlushCbs.length; i++) {
    activePreFlushCbs[i]();
  }
}

export function queuePreFlushCb(cb) {
  queueCb(cb, activePreFlushCbs);
}

function queueCb(cb, activeQueue) {
  activeQueue.push(cb);

  queueFlush();
}

const queue = [];
const activePreFlushCbs = [];

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

function flushPreFlushCbs() {
  for (let i = 0; i < activePreFlushCbs.length; i++) {
    activePreFlushCbs[i]();
  }
}

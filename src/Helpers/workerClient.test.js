import { describe, expect, it, vi } from 'vitest';
import createWorkerClient from './workerClient';

// Worker falso: guarda lo que se le envía y permite simular sus respuestas.
function fakeWorker() {
  const target = new EventTarget();
  const sent = [];
  return {
    sent,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    postMessage: (message, transfer) => sent.push({ message, transfer }),
    terminate: vi.fn(),
    reply: (data) => target.dispatchEvent(new MessageEvent('message', { data })),
    crash: (message) => target.dispatchEvent(Object.assign(new Event('error'), { message })),
  };
}

describe('createWorkerClient', () => {
  it('envía la petición con sus transferibles y resuelve con el resultado', async () => {
    const worker = fakeWorker();
    const client = createWorkerClient(worker);
    const buffer = new ArrayBuffer(8);
    const onProgress = vi.fn();

    const promise = client.request('loadBoard', { buffer }, { transfer: [buffer], onProgress });
    const [{ message, transfer }] = worker.sent;
    expect(message).toEqual({ id: 1, type: 'loadBoard', payload: { buffer } });
    expect(transfer).toEqual([buffer]);

    worker.reply({ id: 1, kind: 'progress', message: 'Parsing' });
    worker.reply({ id: 1, kind: 'result', result: { ok: true } });
    await expect(promise).resolves.toEqual({ ok: true });
    expect(onProgress).toHaveBeenCalledWith('Parsing');
  });

  it('rechaza con el mensaje de error del Worker', async () => {
    const worker = fakeWorker();
    const client = createWorkerClient(worker);
    const promise = client.request('loadBoard', {});
    worker.reply({ id: 1, kind: 'error', message: 'Not manifold' });
    await expect(promise).rejects.toThrow('Not manifold');
  });

  it('empareja cada respuesta con su petición', async () => {
    const worker = fakeWorker();
    const client = createWorkerClient(worker);
    const first = client.request('a', {});
    const second = client.request('b', {});
    worker.reply({ id: 2, kind: 'result', result: 'second' });
    worker.reply({ id: 1, kind: 'result', result: 'first' });
    await expect(first).resolves.toBe('first');
    await expect(second).resolves.toBe('second');
  });

  it('rechaza todo lo pendiente si el Worker falla o se termina', async () => {
    const worker = fakeWorker();
    const client = createWorkerClient(worker);
    const crashed = client.request('a', {});
    worker.crash('WASM failed');
    await expect(crashed).rejects.toThrow('Geometry worker failed: WASM failed');

    const terminated = client.request('b', {});
    client.terminate();
    await expect(terminated).rejects.toThrow('terminated');
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});

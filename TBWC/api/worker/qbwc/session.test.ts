import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls: { sql: string; params: any[] }[] = [];
let responses: any[] = [];

vi.mock('../db', () => ({
  execQuery: vi.fn((_env: any, sql: string, params: any[] = []) => {
    calls.push({ sql, params });
    return Promise.resolve(responses.shift() ?? { rows: [], rowCount: 0 });
  }),
}));

import {
  createSession, getSession, advanceCursor, dropSession, progress,
} from './session';

const ENV = {} as any;

beforeEach(() => {
  calls.length = 0;
  responses = [];
});

describe('createSession', () => {
  it('reaps stale rows, then inserts the ticket + queue as jsonb', async () => {
    responses = [{ rows: [] }, { rows: [] }]; // reap, insert
    const queue = ['<QBXML>a</QBXML>', '<QBXML>b</QBXML>'];
    const s = await createSession(ENV, 'ticket-1', queue);

    expect(calls[0].sql).toMatch(/DELETE FROM public\.qbwc_session WHERE created_at/);
    expect(calls[1].sql).toMatch(/INSERT INTO public\.qbwc_session/);
    expect(calls[1].params[0]).toBe('ticket-1');
    expect(calls[1].params[1]).toBe(JSON.stringify(queue));
    expect(s).toEqual({ ticket: 'ticket-1', companyFile: '', queue, cursor: 0, lastError: '' });
  });
});

describe('getSession', () => {
  it('returns undefined for an empty ticket without querying', async () => {
    expect(await getSession(ENV, '')).toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it('returns undefined when no row matches', async () => {
    responses = [{ rows: [] }];
    expect(await getSession(ENV, 'nope')).toBeUndefined();
  });

  it('maps a db row (jsonb queue already parsed) to a session', async () => {
    responses = [{ rows: [{
      qbwc_session_id: 't1', company_file: 'Acme.QBW',
      queue: ['<a/>', '<b/>'], cursor: 1, last_error: 'boom',
    }] }];
    const s = await getSession(ENV, 't1');
    expect(s).toEqual({
      ticket: 't1', companyFile: 'Acme.QBW', queue: ['<a/>', '<b/>'], cursor: 1, lastError: 'boom',
    });
  });

  it('parses a queue that came back as a JSON string, and defaults nulls', async () => {
    responses = [{ rows: [{
      qbwc_session_id: 't2', company_file: null,
      queue: '["<x/>"]', cursor: null, last_error: null,
    }] }];
    const s = await getSession(ENV, 't2');
    expect(s).toEqual({
      ticket: 't2', companyFile: '', queue: ['<x/>'], cursor: 0, lastError: '',
    });
  });
});

describe('advanceCursor', () => {
  it('increments cursor and records lastError, returning the new cursor', async () => {
    responses = [{ rows: [{ cursor: 3 }] }];
    const c = await advanceCursor(ENV, 't1', 'some error');
    expect(calls[0].sql).toMatch(/SET cursor = cursor \+ 1/);
    expect(calls[0].params).toEqual(['t1', 'some error']);
    expect(c).toBe(3);
  });

  it('passes null when no error is supplied and returns 0 if no row', async () => {
    responses = [{ rows: [] }];
    const c = await advanceCursor(ENV, 'gone');
    expect(calls[0].params).toEqual(['gone', null]);
    expect(c).toBe(0);
  });
});

describe('dropSession', () => {
  it('deletes the session row', async () => {
    responses = [{ rows: [] }];
    await dropSession(ENV, 't1');
    expect(calls[0].sql).toMatch(/DELETE FROM public\.qbwc_session WHERE qbwc_session_id = \$1/);
    expect(calls[0].params).toEqual(['t1']);
  });

  it('no-ops on an empty ticket', async () => {
    await dropSession(ENV, '');
    expect(calls).toHaveLength(0);
  });
});

describe('progress', () => {
  const base = { ticket: 't', companyFile: '', lastError: '' };
  it('is 100 for an empty queue', () => {
    expect(progress({ ...base, queue: [], cursor: 0 })).toBe(100);
  });
  it('floors the percentage through the queue', () => {
    expect(progress({ ...base, queue: ['a', 'b', 'c'], cursor: 1 })).toBe(33);
    expect(progress({ ...base, queue: ['a', 'b', 'c', 'd'], cursor: 3 })).toBe(75);
  });
  it('is 100 once the cursor reaches the end', () => {
    expect(progress({ ...base, queue: ['a', 'b'], cursor: 2 })).toBe(100);
  });
});

import { Config, EventSource, ReadyState } from '../base/config';

export class ListenerRegistry {
  currentStream: Promise<{
    eventSource: EventSource | null;
    healthCheck: unknown;
  } | null> = Promise.resolve(null);
  listeners: { [key: number]: (event: unknown) => void } = {};
  errorListeners: { [key: number]: (event: unknown) => void } = {};
  currentKey = 0;
  currentErrorKey = 0;

  constructor(
    readonly newConnection: () => Promise<EventSource>,
    readonly config: Config,
    readonly healthCheckInterval: number = 1000,
  ) {}

  async initializeConnection(stream: {
    eventSource: EventSource | null;
    healthCheck: unknown | null;
  }): Promise<void> {
    stream.eventSource = await this.newConnection();
    stream.eventSource.onmessage = (event: MessageEvent) => {
      this.config.log.info(
        `Received message from event source:\n${JSON.stringify(event)}`,
      );
      let data = null;
      try {
        data = JSON.parse(event.data) || null;
      } catch (e) {
        return;
      }
      for (const listener of Object.values(this.listeners)) {
        listener(data);
      }
    };
    stream.eventSource.onerror = (event: MessageEvent) => {
      this.config.log.warn(
        'Recieved error message from stream. Notifying error listeners.',
        JSON.stringify(event),
        event,
      );
      for (const listener of Object.values(this.errorListeners)) {
        listener(event);
      }
    };
    const healthCheckRoutine = async () => {
      if (stream.eventSource?.readyState === ReadyState.CLOSED) {
        this.config.log.warn(
          'Realtime connection was discovered as closed (unexpected). Some data may not have been encountered. Reopening.',
        );
        await this.initializeConnection(stream).catch((error) => {
          this.config.log.error(
            'Retry on opening failed connection failed. Notifying error listeners.',
            JSON.stringify(error),
            error,
          );
          for (const listener of Object.values(this.errorListeners)) {
            listener(event);
          }
        });
      } else {
        stream.healthCheck = setTimeout(
          healthCheckRoutine,
          this.healthCheckInterval,
        );
      }
    };
    await healthCheckRoutine();
  }

  closeConnection(stream: {
    eventSource: EventSource | null;
    healthCheck: unknown | null;
  }): void {
    if (stream.healthCheck !== null) {
      // @ts-ignore
      clearInterval(stream.healthCheck as any); // eslint-disable-line
      stream.healthCheck = null;
    }
    if (stream.eventSource !== null) {
      stream.eventSource.close();
      stream.eventSource = null;
    }
  }

  async addEventListener(
    listener: (event: Record<string, unknown>) => void,
  ): Promise<() => Promise<void>> {
    return new Promise((resolve, reject) => {
      this.currentStream = this.currentStream
        .then(async (stream) => {
          const listenerId = this.currentKey++;
          this.listeners[listenerId] = listener;
          if (!stream) {
            stream = { eventSource: null, healthCheck: null };
            await this.initializeConnection(stream);
          }
          resolve(() => this.removeListener(listenerId));
          return stream;
        })
        .catch((err) => {
          reject(err);
          return Promise.reject(err);
        });
    });
  }

  async addErrorListener(
    listener: (event: unknown) => void,
  ): Promise<() => Promise<void>> {
    return new Promise((resolve, reject) => {
      this.currentStream = this.currentStream
        .then((stream) => {
          const listenerId = this.currentErrorKey++;
          this.errorListeners[listenerId] = listener;
          resolve(() => this.removeErrorListener(listenerId));
          return stream;
        })
        .catch((err) => {
          reject(err);
          return Promise.reject(err);
        });
    });
  }

  private removeListener(key: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentStream = this.currentStream
        .then((stream) => {
          delete this.listeners[key];
          if (Object.keys(this.listeners).length) {
            return stream;
          } else if (stream) {
            this.closeConnection(stream);
            stream = null;
          }
          resolve();
          return stream;
        })
        .catch((err) => {
          reject(err);
          return Promise.reject(err);
        });
    });
  }

  private removeErrorListener(key: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentStream = this.currentStream
        .then((stream) => {
          delete this.errorListeners[key];
          resolve();
          return stream;
        })
        .catch((err) => {
          reject(err);
          return Promise.reject(err);
        });
    });
  }
}

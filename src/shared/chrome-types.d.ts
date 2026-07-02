declare namespace chrome {
  namespace i18n {
    function getMessage(messageName: string, substitutions?: string | string[]): string;
    function getUILanguage(): string;
  }

  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
    }

    const sync: StorageArea;
  }

  namespace tabs {
    interface Tab {
      id?: number;
      windowId?: number;
      url?: string;
      active?: boolean;
    }

    interface QueryInfo {
      active?: boolean;
      currentWindow?: boolean;
      lastFocusedWindow?: boolean;
    }

    interface MessageSendOptions {
      frameId?: number;
    }

    function query(queryInfo: QueryInfo): Promise<Tab[]>;
    function sendMessage<T = unknown>(
      tabId: number,
      message: unknown,
      options?: MessageSendOptions
    ): Promise<T>;
    function captureVisibleTab(windowId?: number, options?: { format?: "png" | "jpeg" }): Promise<string>;
  }

  namespace scripting {
    interface InjectionTarget {
      tabId: number;
      frameIds?: number[];
      allFrames?: boolean;
    }

    function executeScript(injection: { target: InjectionTarget; files: string[] }): Promise<unknown[]>;
  }

  namespace downloads {
    function download(options: {
      url: string;
      filename?: string;
      saveAs?: boolean;
      conflictAction?: "uniquify" | "overwrite" | "prompt";
    }): Promise<number>;
  }

  namespace commands {
    interface Command {
      name?: string;
      description?: string;
      shortcut?: string;
    }

    function getAll(): Promise<Command[]>;

    const onCommand: {
      addListener(callback: (command: string) => void): void;
    };
  }

  namespace runtime {
    interface MessageSender {
      tab?: tabs.Tab;
      id?: string;
    }

    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void
      ): void;
    };

    const lastError: { message?: string } | undefined;
    function sendMessage<T = unknown>(message: unknown): Promise<T>;
    function openOptionsPage(): Promise<void>;
  }
}

declare const chrome: {
  i18n: typeof chrome.i18n;
  storage: typeof chrome.storage;
  tabs: typeof chrome.tabs;
  scripting: typeof chrome.scripting;
  downloads: typeof chrome.downloads;
  commands: typeof chrome.commands;
  runtime: typeof chrome.runtime;
};

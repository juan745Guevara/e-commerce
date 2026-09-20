export const NOTIFIER = 'INotifier';

export interface INotifier {
  sendMessage(to: string, message: string): Promise<void>;
}

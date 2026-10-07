import type { Message } from "../domain/message";
import { MessageBubble } from "./message-bubble";

type MessageListProps = {
  selectedPhone: string | null;
  messages: Message[];
};

export const MessageList = ({ selectedPhone, messages }: MessageListProps) => (
  <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-6">
    <div className="mx-auto flex min-h-full w-full max-w-200 flex-col gap-3">
      {!selectedPhone ? (
        <p className="my-auto text-center text-sm text-muted-foreground">
          Создайте или выберите чат
        </p>
      ) : messages.length === 0 ? (
        <p className="my-auto text-center text-sm text-muted-foreground">
          Пока нет сообщений
        </p>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}
    </div>
  </div>
);

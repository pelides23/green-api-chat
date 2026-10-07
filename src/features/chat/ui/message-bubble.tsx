import { cn } from "@/shared/lib/css";
import type { Message } from "../domain/message";

type MessageBubbleProps = {
  message: Message;
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isOutgoing = message.direction === "outgoing";

  return (
    <div className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[75%] whitespace-pre-wrap wrap-break-word rounded-lg px-4 py-2",
          isOutgoing
            ? "bg-primary/10 text-foreground"
            : "border border-border bg-background text-foreground",
        )}
      >
        {message.text}
      </p>
    </div>
  );
};

import { cn } from "@/shared/lib/css";
import { Button } from "@/shared/ui/kit/button";
import type { Message } from "../domain/message";

type ChatListProps = {
  chats: Pick<Message, "phone">[];
  selectedPhone: string | null;
  onSelectChat: (phone: string) => void;
};

export const ChatList = ({
  chats,
  selectedPhone,
  onSelectChat,
}: ChatListProps) => (
  <div className="flex min-h-0 flex-1 overflow-y-auto p-6">
    {chats.length === 0 && (
      <p className=" flex-1 my-auto text-center text-sm text-muted-foreground">
        Нет созданных чатов
      </p>
    )}
    {chats.length > 0 && (
      <div className="flex flex-col gap-2 w-full">
        {chats.map((chat) => {
          const isSelected = selectedPhone === chat.phone;
          return (
            <Button
              key={chat.phone}
              className={cn(
                "cursor-pointer rounded-md p-2 text-left disabled:opacity-50",
                isSelected
                  ? "bg-primary"
                  : "bg-muted text-primary hover:bg-primary/10",
              )}
              onClick={() => onSelectChat(chat.phone)}
            >
              +{chat.phone}
            </Button>
          );
        })}
      </div>
    )}
  </div>
);

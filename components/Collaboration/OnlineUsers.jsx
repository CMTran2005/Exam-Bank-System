import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function OnlineUsers({ users = [] }) {
    if (!users || users.length === 0) return null;

    return (
        <div className="flex items-center -space-x-2">
            <TooltipProvider>
                {users.map((user, idx) => (
                    <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                            <div className="w-8 h-8 rounded-full border-2 border-background shadow-sm hover:-translate-y-1 transition-transform cursor-pointer relative flex items-center justify-center bg-primary/10 overflow-hidden">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-primary text-xs font-bold uppercase">
                                        {user.name ? user.name.charAt(0) : "U"}
                                    </span>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs font-medium">{user.name}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    );
}

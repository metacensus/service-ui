import getInitials from "@/functions/getUserInitials";

type UserAvatarProps = {
  name: string;
};

const UserAvatar = ({ name }: UserAvatarProps) => {
  return (
    <div className="xl:w-96 w-full flex gap-2 items-center">
      <div className="w-8 h-8 flex items-center justify-center bg-mc-fill-solid rounded-full text-mc-ink-on-fill font-semibold">
        {getInitials(name)}
      </div>
      <span>{name}</span>
    </div>
  );
};

export default UserAvatar;

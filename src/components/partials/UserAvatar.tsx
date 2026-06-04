import getInitials from "@/functions/getUserInitials";

type UserAvatarProps = {
  name: string;
};

const UserAvatar = ({ name }: UserAvatarProps) => {
  return (
    <div className="xl:w-96 w-full flex gap-2 items-center">
        {getInitials(name)}
      </div>
      <span>{name}</span>
    </div>
  );
};

export default UserAvatar;

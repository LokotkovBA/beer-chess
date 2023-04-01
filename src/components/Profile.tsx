import type { Room } from "@prisma/client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React, { useRef } from "react";
import { toast } from "react-hot-toast";
import { api } from "~/utils/api";

type ProfileProps = {
    name: string,
    image?: string | null,
    rooms?: Room[] | null
}

const Profile: React.FC<ProfileProps> = ({ name, image, rooms }) => {
    const { data: sessionData } = useSession();
    const inputRef = useRef<HTMLInputElement>(null);
    const { mutate: changeName } = api.users.changeName.useMutation({
        onSuccess: () => {
            toast.success("Success");
        }
    });

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (inputRef.current) {
            changeName({ newName: inputRef.current.value, oldName: name });
        }
    }

    return (
        <article>
            {image && <Image width={45} height={45} className="profile-picture" alt={`${name}'s profile picture`} src={image} />}
            <form onSubmit={onSubmit} className="profile__name">
                {sessionData?.user.name === name ?
                    <>
                        <input ref={inputRef} className="name_input" type="text" defaultValue={name} placeholder="Имя пользователя" />
                        <button className="button" type="submit">Change</button>
                    </>
                    :
                    <p>{name}</p>}
            </form>
            {rooms?.map((room) => {
                return <Link className="page-select" key={room.id} href={`/room/${room.id}`}>Go to room {room.title}</Link>;
            })}

        </article>);
};

export default Profile;
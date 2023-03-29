import type { Game } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React, { useRef } from "react";
import { toast } from "react-hot-toast";
import { api } from "~/utils/api";

type ProfileProps = {
    uniqueName: string,
    image?: string | null,
    games?: Game[] | null
}

const Profile: React.FC<ProfileProps> = ({ uniqueName, image, games }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { mutate: changeName } = api.users.changeName.useMutation({
        onSuccess: () => {
            toast.success("Success");
        }
    });

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (inputRef.current) {
            changeName({ name: inputRef.current.value });
        }
    }

    return (
        <article className="profile">
            {image && <Image width={24} height={24} className="profile__image" alt={`${uniqueName}'s profile picture`} src={image} />}
            <form onSubmit={onSubmit} className="profile__name">
                <input ref={inputRef} className="name_input" type="text" defaultValue={uniqueName} style={{ color: "black" }} placeholder="Имя пользователя" />
                <button className="button" type="submit">Изменить</button>
            </form>
            {games && games.map((game) => {
                return <Link className="page-select" key={game.id} href={`/games/${game.id}`}>Перейти {game.id}</Link>;
            })}

        </article>);
};

export default Profile;
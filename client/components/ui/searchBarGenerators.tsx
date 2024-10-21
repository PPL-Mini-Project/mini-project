import Image from "next/image";
import emptyProfileImage from "@/public/Images/missing.png";
import { ReactNode } from "react";
import Link from "next/link";
import { imageLoader } from "@/functions/imageLoader";
import { ScrollArea } from "./scroll-area";
import { formatDate } from "../Review";

interface SearchUser {
  username: string;
  bio: string;
  avatar_path: string;
}

export function generateSearchUsers(
  searchUsers: SearchUser[] | undefined
): ReactNode {
  if (!searchUsers || searchUsers.length === 0) {
    return <h1>No users found!</h1>;
  }

  return (
    <ScrollArea className="h-48 flex">
      {searchUsers.map((user) => (
        <Link
          href={`/profile/${user.username}`}
          key={user.username}
          className="flex p-4 border hover:border-green-300 hover:text-green-300 items-center rounded-md w-[23.9rem] mb-4"
        >
          <div className="w-16 h-16 relative flex items-center">
            <Image
              src={
                user.avatar_path === "" ? emptyProfileImage : user.avatar_path
              }
              alt={user.username.substring(0, 2)}
              layout="fill"
              objectFit="cover"
              className="rounded-full"
              loader={user.avatar_path === "" ? undefined : imageLoader}
            />
          </div>
          <div className="w-3/5 p-4">
            <h1 className="text-xl font-bold">{user.username}</h1>
            <p className="text-gray-600 truncate">{user.bio}</p>
          </div>
        </Link>
      ))}
    </ScrollArea>
  );
}

interface SearchMovie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  overview: string;
}

export function generateSearchMovies(
  searchMovies: SearchMovie[] | undefined
): ReactNode {
  if (!searchMovies || searchMovies.length === 0) {
    return <h1>No movies found!</h1>;
  }
  return (
    <ScrollArea className="h-48 flex">
      {searchMovies.map((movie) => (
        <Link
          href={`/movies/${movie.id}`}
          key={movie.id}
          className="flex p-4 border hover:border-green-300 hover:text-green-300 items-center rounded-md w-[23.9rem] mb-4"
        >
          <div className="w-16 h-24 relative flex items-center">
            <Image
              src={
                movie.poster_path === "" || movie.poster_path === null
                  ? emptyProfileImage
                  : movie.poster_path
              }
              alt={movie.title.substring(0, 2)}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
              loader={
                movie.poster_path === "" || movie.poster_path === null
                  ? undefined
                  : imageLoader
              }
            />
          </div>
          <div className="w-4/5 px-2 flex flex-col">
            <h1 className="text-xl font-bold mb-4">{movie.title}</h1>
            <p className="text-sm font-thin truncate">{movie.overview}</p>
            <h6 className="text-xs font-extralight">
              {formatDate(movie.release_date)}
            </h6>
          </div>
        </Link>
      ))}
    </ScrollArea>
  );
}

interface SearchPerson {
  id: number;
  name: string;
  profile_path: string;
  department : string;
}

export function generateSearchPeople(
  searchPeople: SearchPerson[] | undefined
): ReactNode {
  if (!searchPeople || searchPeople.length === 0) {
    return <h1>No people found!</h1>;
  }

  return (
    <ScrollArea className="h-48 flex">
      {searchPeople.map((person) => (
        <Link
          href={`/people/${person.id}`}
          key={person.name}
          className="flex p-4 border hover:border-green-300 items-center rounded-md w-full mb-4"
        >
          <div className="w-16 h-24 relative flex items-center">
            <Image
              src={
                person.profile_path === "" || person.profile_path === null
                  ? emptyProfileImage
                  : person.profile_path
              }
              alt={person.name.substring(0, 2)}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
              loader={
                person.profile_path === "" || person.profile_path === null
                  ? undefined
                  : imageLoader
              }
            />
          </div>
          <div className="w-3/5 p-4">
            <h1 className="text-xl font-bold">{person.name}</h1>
            <h1 className="text-sm font-bold">{person.department}</h1>
          </div>
        </Link>
      ))}
    </ScrollArea>
  );
}

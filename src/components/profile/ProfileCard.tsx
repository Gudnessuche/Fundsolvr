/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import { BOT_AVATAR_ENDPOINT } from "~/lib/constants";
import { useRelayStore } from "~/store/relay-store";
import { Copy, Github, Globe, Zap } from "lucide-react";
import { nip05, nip19 } from "nostr-tools";
import { profileContent, shortNpub, useBatchedProfiles } from "react-nostr";
import { toast } from "sonner";

import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import ProfileMenu from "./ProfileMenu";

type Props = {
  pubkey: string;
};

// type Nip05 = `${string}@${string}`;

// TODO: abstract this into a hook or util function
const verifyNip05 = async (nip05Id: string) => {
  // split nip05 into parts
  const parts = nip05Id.split("@");

  // grab the first part that is the name
  const name = parts[0];

  // grab the second part that is the domain
  const domain = parts[1];

  // check if the name is valid
  if (!name) {
    return undefined;
  }

  if (!domain) {
    return undefined;
  }

  const res = await nip05.searchDomain(domain, name);

  console.log(res);

  return res;
};

// write a function that removes just the first character if it is "_"
function trimNip05(nip05Id: string | undefined) {
  if (!nip05Id) {
    return undefined;
  }
  if (nip05Id.startsWith("_")) {
    return nip05Id.slice(1);
  }
  return nip05Id;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    toast("Clipboard error", {
      description: `Failed to copy to clipboard: ${err as string}`,
    });
  }
}

export default function ProfileCard({ pubkey }: Props) {
  const { subRelays } = useRelayStore();
  const profileEvent = useBatchedProfiles(pubkey, subRelays);

  console.log(profileEvent);

  // TODO: showld probably break this into global state as a map
  const [nipVerified, setNipVerified] = useState(false);

  useEffect(() => {
    if (!profileEvent) {
      return;
    }

    if (nipVerified) {
      return;
    }

    const verify = async () => {
      const nip05Id = profileContent(profileEvent).nip05;
      if (!nip05Id) {
        return;
      }
      if (nipVerified) {
        return;
      }
      const res = await verifyNip05(nip05Id);
      console.log(res);

      if (res) {
        setNipVerified(true);
      }

      if (!res) {
        setNipVerified(false);
      }
    };
    void verify();
  }, [profileEvent]);

  const handleCopyClick = async () => {
    if (!pubkey) {
      return;
    }

    await copyText(nip19.npubEncode(pubkey));
  };

  return (
    <div
      // className="sticky top-2 min-w-[20rem]"
      className="py-4"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-x-4">
            <img
              src={
                profileContent(profileEvent).picture ??
                BOT_AVATAR_ENDPOINT + pubkey
              }
              alt=""
              className="aspect-square w-24 rounded-md border border-border dark:border-border"
            />

            <div className="flex flex-col gap-y-1">
              <span className="text-3xl">
                {profileContent(profileEvent).name}
              </span>
              <span className="flex items-center gap-x-2">
                <span className="text-muted-foreground">
                  {nipVerified
                    ? trimNip05(profileContent(profileEvent).nip05) ??
                      shortNpub(pubkey)
                    : shortNpub(pubkey)}
                </span>
                <Copy
                  width={12}
                  className="cursor-pointer text-muted-foreground hover:text-black active:scale-90 dark:hover:text-white"
                  onClick={handleCopyClick}
                />
                {profileEvent && <ProfileMenu profileEvent={profileEvent} />}
              </span>
            </div>
          </div>
        </CardHeader>
        {profileContent(profileEvent).about && (
          <CardContent>{profileContent(profileEvent).about}</CardContent>
        )}
        {(profileContent(profileEvent).website ??
          profileContent(profileEvent).lud16 ??
          profileContent(profileEvent).github) && (
          <CardFooter>
            <div className="flex flex-col gap-y-2">
              {profileContent(profileEvent).website && (
                <a
                  className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white"
                  href={profileContent(profileEvent).website}
                  target="_blank"
                >
                  <span className="flex items-center">
                    <Globe className="mr-1 h-4 w-4" />
                    {profileContent(profileEvent).website}
                  </span>
                </a>
              )}

              {profileContent(profileEvent).lud16 && (
                <span className="flex items-center text-sm font-light text-muted-foreground">
                  <Zap className="mr-1 h-4 w-4" />
                  {profileContent(profileEvent).lud16}
                </span>
              )}

              {profileContent(profileEvent).github && (
                <a
                  className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white"
                  href={`https://github.com/${profileContent(profileEvent).github}`}
                  target="_blank"
                >
                  <span className="flex items-center">
                    <Github className="mr-1 h-4 w-4" />
                    {profileContent(profileEvent).github}
                  </span>
                </a>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

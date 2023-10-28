"use client";

import { useEffect } from "react";

import { type Event, getEventHash } from "nostr-tools";

import { removeTag } from "../lib/utils";
import { useBountyEventStore } from "../stores/eventStore";
import { useRelayStore } from "../stores/relayStore";
import { useUserProfileStore } from "../stores/userProfileStore";

export default function AssignButton() {
  const { cachedBountyEvent, setCachedBountyEvent, updateBountyEvent, updateUserEvent } = useBountyEventStore();
  const { publish, relayUrl } = useRelayStore();
  const { userPublicKey } = useUserProfileStore();

  const handleAssign = async (e: any) => {
    e.preventDefault();
    if (!cachedBountyEvent) {
      alert("No bounty event cached");
      return;
    }

    let tags = removeTag("p", cachedBountyEvent.tags);
    const assignedTo = ["p", userPublicKey];
    tags.push(assignedTo);
    tags = removeTag("s", tags);
    const status = ["s", "assigned"];
    tags.push(status);

    let event: Event = {
      id: "",
      sig: "",
      kind: cachedBountyEvent.kind,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags,
      content: cachedBountyEvent.content,
      pubkey: userPublicKey,
    };

    event.id = getEventHash(event);
    event = await window.nostr.signEvent(event);

    function onSeen() {
      if (!cachedBountyEvent) {
        return;
      }

      updateBountyEvent(relayUrl, cachedBountyEvent.id, event);
      updateUserEvent(relayUrl, cachedBountyEvent.id, event);
      setCachedBountyEvent(event);
    }

    // console.log("UPDATED EVENT:", event);

    publish([relayUrl], event, onSeen);
  };

  return (
    <button
      onClick={handleAssign}
      className="mx-4 rounded-lg bg-indigo-500 p-2 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:text-white hover:dark:bg-indigo-500"
    >
      Assign
    </button>
  );
}
import { useEffect } from "react";
import { supabase } from "../supabaseClient.js";

export default function useRealtimeSync({ refetchEvents, refetchWorkflow, refetchAdRequests }) {
  useEffect(() => {
    const channel = supabase
      .channel("ambria-hub-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "custom_events" }, () => {
        refetchEvents();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "builtin_overrides" }, () => {
        refetchEvents();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "workflow_status" }, () => {
        refetchWorkflow();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_requests" }, () => {
        refetchAdRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchEvents, refetchWorkflow, refetchAdRequests]);
}

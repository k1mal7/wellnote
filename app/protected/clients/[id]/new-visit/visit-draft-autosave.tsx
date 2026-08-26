"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { saveVisitDraft } from "./visit-session-actions";

type Props = {
  formId: string;
};

export default function VisitDraftAutosave({
  formId,
}: Props) {
  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const isDiscardingRef = useRef(false);

  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    const form = document.getElementById(
      formId
    ) as HTMLFormElement | null;

    if (!form) return;

    async function saveDraft() {
      if (isDiscardingRef.current) {
        return;
      }

      const currentForm =
        document.getElementById(
          formId
        ) as HTMLFormElement | null;

      if (!currentForm) return;

      setStatus("saving");

      try {
        const formData =
          new FormData(currentForm);

        await saveVisitDraft(formData);

        if (!isDiscardingRef.current) {
          setStatus("saved");
        }
      } catch (error) {
        if (isDiscardingRef.current) {
          return;
        }

        console.error(error);
        setStatus("error");
      }
    }

    function handleDiscard() {
      isDiscardingRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    function scheduleSave() {
      if (isDiscardingRef.current) {
        return;
      }

      setStatus("idle");

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(
        saveDraft,
        1000
      );
    }

    function saveOnBlur() {
      if (isDiscardingRef.current) {
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      void saveDraft();
    }

    form.addEventListener(
      "input",
      scheduleSave
    );

    form.addEventListener(
      "change",
      scheduleSave
    );

    form.addEventListener(
      "focusout",
      saveOnBlur
    );

    window.addEventListener(
      "wellnote-discard-draft",
      handleDiscard
    );

    return () => {
      form.removeEventListener(
        "input",
        scheduleSave
      );

      form.removeEventListener(
        "change",
        scheduleSave
      );

      form.removeEventListener(
        "focusout",
        saveOnBlur
      );

      window.removeEventListener(
        "wellnote-discard-draft",
        handleDiscard
      );

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [formId]);

  return (
    <div className="mb-4 text-right text-xs font-semibold">
      {status === "saving" && (
        <span className="text-slate-400">
          Saving draft...
        </span>
      )}

      {status === "saved" && (
        <span className="text-emerald-700">
          ✓ Draft saved
        </span>
      )}

      {status === "error" && (
        <span className="text-red-600">
          Draft could not be saved
        </span>
      )}
    </div>
  );
}
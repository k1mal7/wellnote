"use client";

type Props = {
  formId: string;
};

export default function DiscardDraftButton({
  formId,
}: Props) {
  function handleClick() {
    const confirmed = window.confirm(
      "Discard this draft visit? Your autosaved SOAPIE note and assessments saved during this draft will be deleted."
    );

    if (!confirmed) {
      return;
    }

    window.dispatchEvent(
      new Event("wellnote-discard-draft")
    );

    const form = document.getElementById(
      formId
    ) as HTMLFormElement | null;

    form?.requestSubmit();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
    >
      Discard Draft
    </button>
  );
}
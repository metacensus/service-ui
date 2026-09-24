        {error}
      </div>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

      setError(BLANK_REASON_MESSAGE);
      textareaRef.current?.focus();
      return;
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setEditorOpen}>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={16}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            textareaRef.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const current = document.activeElement;
            if (!current || current === document.body || current.closest("[data-membership-editor]"))
              triggerRef.current?.focus({ preventScroll: true });
          }}
          data-membership-editor

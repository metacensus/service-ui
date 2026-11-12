"use client";

import { SignPrompt, signedWriteError } from "@/components/shared/SignedWrite";
import { apiClient } from "@/lib/apiClient";
import { FieldError, Notice } from "@metacensus/library-ui";
import { PlusIcon, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const REQUIRED = "This field is required";

type CreateTopicProps = {
  setOpen: (open: boolean) => void;
};

type CreateTopicInputs = {
  name: string;
  description: string;
};

const CreateTopic = ({ setOpen }: CreateTopicProps) => {
  const client = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTopicInputs>();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (content: CreateTopicInputs) =>
      apiClient.createTopic({ content }),
    onSuccess: async () => {
      setOpen(false);
      await client.invalidateQueries({ queryKey: ["topics"] });
    },
  });

  return (
    <form
      className="flex flex-col w-full gap-8"
      onSubmit={handleSubmit((data) => mutate(data))}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="topic-name">Topic Name</Label>
        <Input
          id="topic-name"
          placeholder="Name"
          aria-describedby={errors.name ? "topic-name-error" : undefined}
          aria-invalid={!!errors.name}
          {...register("name", { required: REQUIRED })}
          autoComplete="off"
          className="font-bold text-sm"
        />
        {errors.name && (
          <FieldError id="topic-name-error">{errors.name.message}</FieldError>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="topic-description">Topic Description</Label>
        <Textarea
          id="topic-description"
          aria-describedby={errors.description ? "topic-description-error" : undefined}
          aria-invalid={!!errors.description}
          {...register("description", { required: REQUIRED })}
          className="font-bold text-sm h-fit xl:min-h-32"
          placeholder="Description"
        />
        {errors.description && (
          <FieldError id="topic-description-error">
            {errors.description.message}
          </FieldError>
        )}
      </div>
      {error && <Notice role="alert">{signedWriteError(error)}</Notice>}
      <div className="flex gap-3 mt-0 xl:mt-12">
        <Button variant="primary" type="submit" size="sm" disabled={isPending}>
          <PlusIcon className="w-5 h-5 mr-2" />
          <span>Create Topic</span>
        </Button>
        <Button
          variant="outline"
          type="button"
          size="sm"
          onClick={() => setOpen(false)}
        >
          <X className="w-5 h-5 mr-2" />
          <span>Cancel</span>
        </Button>
      </div>
      <SignPrompt action="Creating a topic" />
    </form>
  );
};

export default CreateTopic;

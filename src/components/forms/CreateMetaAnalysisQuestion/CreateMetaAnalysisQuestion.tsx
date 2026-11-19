import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SignPrompt, signedWriteError } from "@/components/shared/SignedWrite";
import { useToast } from "@/hooks/use-toast";
import { propsQuery } from "@/hooks/useProps";
import { apiClient } from "@/lib/apiClient";
import queryClient from "@/lib/queryClient";
import { Prop_Type } from "@metacensus/api";
import { FieldError } from "@metacensus/library-ui";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type CreateMetaAnalysisQuestionProps = {
  topicId: string;
  setDrawerOpen: (open: boolean) => void;
};

interface FormValues {
  statement: string;
}

const CreateMetaAnalysisQuestion: React.FC<CreateMetaAnalysisQuestionProps> = ({
  topicId,
  setDrawerOpen,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>();

  const { toast } = useToast();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await apiClient.createProp({
        topicId,
        content: {
          topicId,
          type: Prop_Type.TopicQuestion,
          description: data.statement,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: propsQuery(topicId).queryKey,
      });

      toast({
        title: "Meta Analysis Question",
        description: "Meta Analysis Question created successfully",
      });

      // Close the drawer after successful submission
      setDrawerOpen(false);

      // Reset the form
      reset();
    } catch (error) {
      // Handle error
      console.error("Error creating Meta Analysis Question:", error);
      toast({
        title: "Meta Analysis Question",
        description: signedWriteError(error),
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Meta Analysis Question */}
      <div className="mt-4">
        <Label htmlFor="statement">Meta Analysis Question</Label>
        <Textarea
          id="statement"
          aria-invalid={!!errors.statement}
          aria-describedby={errors.statement ? "statement-error" : undefined}
          {...register("statement", { required: "This field is required" })}
          placeholder="Enter the Meta Analysis Question here..."
          className="mt-1 block w-full"
        />
        {errors.statement && (
          <FieldError id="statement-error">{errors.statement.message}</FieldError>
        )}
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
      <div className="mt-2">
        <SignPrompt action="Proposing a question" />
      </div>
    </form>
  );
};

export default CreateMetaAnalysisQuestion;

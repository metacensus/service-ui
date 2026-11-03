import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAuthHeaders } from "@/functions/getAuthHeaders";
import { useToast } from "@/hooks/use-toast";
import queryClient from "@/lib/queryClient";
import { routes } from "@/lib/routes";
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
      const headers = getAuthHeaders();
      const response = await fetch(`${routes.api.topic}/${topicId}/prop`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "TopicQuestion",
          description: data.statement,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create Meta Analysis Question");
      }

      await queryClient.invalidateQueries({
        queryKey: [`props-${topicId}`],
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
        description: "Unable to create Meta Analysis Question. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mt-4">
        <Textarea
          {...register("statement", { required: "This field is required" })}
          placeholder="Enter the Meta Analysis Question here..."
          className="mt-1 block w-full"
        />
        {errors.statement && (
        )}
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
};

export default CreateMetaAnalysisQuestion;

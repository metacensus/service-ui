// CreateConsensusStatement.tsx

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAuthHeaders } from "@/functions/getAuthHeaders";
import { useToast } from "@/hooks/use-toast";
import queryClient from "@/lib/queryClient";
import { routes } from "@/lib/routes";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type CreateConsensusStatementProps = {
  topicId: string;
  setDrawerOpen: (open: boolean) => void;
};

interface FormValues {
  statement: string;
}

const CreateConsensusStatement: React.FC<CreateConsensusStatementProps> = ({
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
          type: "Statement",
          description: data.statement,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create Consensus Statement");
      }

      await queryClient.invalidateQueries({
        queryKey: [`statements-${topicId}`],
      });

      toast({
        title: "Consensus Statement",
        description: "Consensus Statement created successfully",
      });

      // Close the drawer after successful submission
      setDrawerOpen(false);

      // Reset the form
      reset();
    } catch (error) {
      // Handle error
      console.error("Error creating Consensus Statement:", error);
      toast({
        title: "Consensus Statement",
        description: "Unable to create Consensus Statement. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mt-4">
        <Textarea
          {...register("statement", { required: "This field is required" })}
          placeholder="Enter the consensus statement here..."
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

export default CreateConsensusStatement;

"use client";

import { getAuthHeaders } from "@/functions/getAuthHeaders";
import { useFetchData } from "@/hooks/useFetchData";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Category } from "../../../types/Category";
import { Contributor } from "../../../types/Contributor";
import { Domain } from "../../../types/Domain";
import MultiSelectMenu from "../shared/MultiSelectMenu";
import SingleSelectMenu from "../shared/SingleSelectMenu";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { routes } from "@/lib/routes";

type CreateTopicProps = {
  setOpen: (open: boolean) => void;
};

type CreateTopicInputs = {
  id?: string;
  name: string;
  domain: { id: string | number; name: string };
  categories: { id: string | number; name: string }[];
  admins: { id: string | number; name: string }[];
  description: string;
  minimumExtractionReviews: number;
};

const CreateTopic = ({ setOpen }: CreateTopicProps) => {
  const client = useQueryClient();


  const { mutate: createNetworkTopic } = useMutation({
    mutationFn: async (data: CreateTopicInputs) => {
      const createTopicRequest = await fetch(routes.api.topic, {
        method: "POST",
        headers: networkHeaders,
        body: JSON.stringify(data),
      });
      // Single canonical create. `POST /topic` writes the topic and its
      // junction rows transactionally; there is no separate mirror call.
      const createTopicResponse = await createTopicRequest.json();
      return createTopicResponse;
    },
  });

  const onSubmit = async (data: CreateTopicInputs) => {
    createNetworkTopic(data, {
      onSuccess: async (response) => {
        if (response?.id) {
          setOpen(false);
        }

        await client.invalidateQueries({
          queryKey: ["topics"],
        });
      },
      onError: (error) => {
        console.error(error);
      },
    });
  };

  const [openCategoryMenu, setOpenCategoryMenu] = useState(false);

  const [openDomainMenu, setOpenDomainMenu] = useState(false);

  const domainRef = useRef(null);

  const [openAdminMenu, setOpenAdminMenu] = useState(false);

  const {
    data: domainsData,
    error: domainsError,
    isLoading: domainsLoading,
  } = useFetchData<undefined, Domain[]>(
    routes.api.domain,
    ["create-topic-form-domains"],
    "POST"
  );

  const {
    data: categoryData,
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useFetchData<undefined, Category[]>(
    routes.api.category,
    ["create-topic-form-categories"],
    "POST"
  );

  const {
    data: adminData,
    error: adminsError,
    isLoading: adminsLoading,
  } = useFetchData<undefined, Contributor[]>(
    `${routes.api.user}?role=admin&limit=100`,
    ["create-topic-form-admins"],
    "GET"
  );

  useOnClickOutside(domainRef, () => {
    if (domainRef.current) {
      setOpenDomainMenu(false);
    }
  });

  const domainOptions = useMemo(() => {
    if (domainsLoading || !domainsData || domainsError) return [];
    return domainsData?.map((domain: Domain) => ({
      id: domain.id,
      name: domain.name,
    }));
  }, [domainsData, domainsLoading, domainsError]);

  const categoryOptions = useMemo(() => {
    if (categoriesLoading || !categoryData || categoriesError) return [];
    return categoryData?.map((category: Category) => ({
      id: category.id,
      name: category.name,
    }));
  }, [categoryData, categoriesLoading, categoriesError]);

  const adminOptions = useMemo(() => {
    if (adminsLoading || !adminData || adminsError) return [];
    return adminData?.map((admin: Contributor) => ({
      id: admin.id,
      name: admin.name,
    }));
  }, [adminData, adminsLoading, adminsError]);

  const domain = watch("domain");

  const categories = watch("categories", []);

  const admins = watch("admins", []);

  return (
    <form
      className="flex flex-col w-full gap-8"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-1">
        <Input
          placeholder="Name"
          autoComplete="off"
        />
      </div>

      <SingleSelectMenu
        open={openDomainMenu}
        setOpen={setOpenDomainMenu}
        name="domain"
        options={domainOptions}
        onSelect={(_, value) => {
          setValue("domain", value);
          setOpenDomainMenu(false);
        }}
        selectedItem={domain}
        label="Domain"
        placeholder="Select Domain"
      />

      <MultiSelectMenu
        open={openCategoryMenu}
        setOpen={setOpenCategoryMenu}
        name="categories"
        options={categoryOptions}
        onSelect={(_, value) => {
          setValue("categories", [...categories, value]);
        }}
        includeSearch={true}
        selectedItems={categories}
        setValue={(_, value: any) => {
          setValue("categories", value);
        }}
        label="Topic Categories"
        placeholder="Select Categories"
      />

      <MultiSelectMenu
        open={openAdminMenu}
        setOpen={setOpenAdminMenu}
        name="admins"
        options={adminOptions}
        onSelect={(_, value) => {
          setValue("admins", [...admins, value]);
        }}
        selectedItems={admins}
        setValue={(_, value: any) => {
          setValue("admins", value);
        }}
        label="Topic Admins"
        placeholder="Select Admins"
        includeSearch={true}
      />

      <div className="flex flex-col gap-1">
        <Input
          type="number"
          min={1}
          defaultValue={2}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Textarea
          placeholder="Description"
        />
      </div>
      <div className="flex gap-3 mt-0 xl:mt-12">
        <Button variant="primary" type="submit" size="sm">
          <PlusIcon className="w-5 h-5 mr-2" />
          <span>Create Topic</span>
        </Button>
        <Button
          variant="outline"
          type="button"
          size="sm"
          onClick={() => setOpen(false)}
        >
          <span>Cancel</span>
        </Button>
      </div>
    </form>
  );
};

export default CreateTopic;

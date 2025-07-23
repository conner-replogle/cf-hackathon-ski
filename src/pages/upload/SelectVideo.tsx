import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Layout from "./layout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import Combobox from "@/components/ui/combo-box";
import { athletes } from "./mock";
// @ts-ignore
import FilePondPluginMediaPreview from "filepond-plugin-media-preview";
import "filepond-plugin-media-preview/dist/filepond-plugin-media-preview.min.css";

registerPlugin(FilePondPluginMediaPreview);

const FormSchema = z.object({
  video: z.instanceof(File, { message: "Please upload a video" }),
  athlete: z.string({
    required_error: "Please select an athlete.",
  }),
});

export default function SelectVideoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const params = ["event", "trail", "turn"];
    for (const param of params) {
      if (!searchParams.get(param)) {
        navigate("/upload/event");
      }
    }
    // TOOD: validate eventId incase its stale
  }, [searchParams]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log("form data", data);
    form.reset();
  }
  return (
    <Layout description="Finally upload a video and tag an athlete">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="video"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video</FormLabel>
                <FormControl>
                  <FilePond
                    files={field.value && [field.value]}
                    onupdatefiles={(files) => {
                      if (files) {
                        form.setValue("video", files[0].file as File);
                        form.clearErrors();
                      }
                    }}
                    allowMultiple={false}
                    name="files"
                    labelIdle='Drag & Drop videos or <span class="filepond--label-action">Click Here</span>'
                    credits={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="athlete"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Athlete</FormLabel>
                <Combobox
                  data={athletes}
                  value={field.value}
                  onSelect={(val) => form.setValue("athlete", val)}
                  itemLabel="athlete"
                />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full">
            Upload
          </Button>
          <Button
            type="button"
            size="lg"
            className="w-full"
            variant="secondary"
            onClick={() =>
              navigate(`/upload/trailandturn?${searchParams.toString()}`)
            }
          >
            Back
          </Button>
        </form>
      </Form>
    </Layout>
  );
}

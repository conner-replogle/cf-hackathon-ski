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
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import Combobox from "@/components/ui/combo-box";
// @ts-ignore
import FilePondPluginMediaPreview from "filepond-plugin-media-preview";
import "filepond-plugin-media-preview/dist/filepond-plugin-media-preview.min.css";
import {
  useAthletes,
  useCreateRun,
  useRuns,
  useRoute,
  useTurn,
  useTurns,
} from "@/services/api";
import { Check, ChevronsUpDown, Plus, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

registerPlugin(FilePondPluginMediaPreview);

const FormSchema = z.object({
  video: z.instanceof(File, { message: "Please upload a video" }),
  athlete: z.number({
    required_error: "Please select an athlete.",
  }),
  run: z.number({
    required_error: "Please select a run.",
  }),
});

export default function SelectVideoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const turnId = parseInt(searchParams?.get("turn") || "");
  const routeId = parseInt(searchParams?.get("route") || "");
  const { mutateAsync: createRun } = useCreateRun();

  // Fetch route and turn data for display
  const { data: route } = useRoute(routeId);
  const { data: turn } = useTurn(turnId);
  const { data: routeTurns } = useTurns(routeId);
  console.log(routeTurns);

  useEffect(() => {
    const params = ["event", "route", "turn"];
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

  const { data: athletes } = useAthletes();
  const athletesData = useMemo(
    () =>
      athletes
        ? athletes.map((athlete) => ({
            label: athlete.athleteName,
            value: athlete.id,
          }))
        : [],
    [athletes],
  );

  const selectedAthleteId = form.watch("athlete");
  const { data: runs } = useRuns(routeId, selectedAthleteId);

  const runsData = useMemo(
    () =>
      runs
        ? runs.map((run) => ({
            label: "Run " + run.runOrder,
            value: run.id,
            active: run.clips.find((a) => a.turnId == turnId) == null,
          }))
        : [],
    [runs],
  );

  const handleCreateRunClicked = async () => {
    const runId = await createRun({
      routeId: parseInt(searchParams?.get("route") || ""),
      athleteId: selectedAthleteId,
      runOrder: -1,
    });

    form.setValue("run", runId.id);
    setComboboxOpen(false);
  };

  const [comboboxOpen, setComboboxOpen] = useState(false);

  const selectedRunId = form.watch("run");

  const selectedRun = runs?.find((run) => run.id == selectedRunId);

  return (
    <Layout description="Finally upload a video and tag an athlete">
      <Form {...form}>
        {/* Current Route and Turn Display */}
        {(route || turn) && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Current Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {route && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">
                      Route
                    </h4>
                    <p className="text-lg font-semibold">{route.routeName}</p>
                  </div>
                )}
                {turn && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">
                      Turn
                    </h4>
                    <p className="text-lg font-semibold">{turn.turnName}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Duplicate Upload Warning */}
        {/* { && selectedRunId && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Warning:</strong> This turn already has a clip uploaded for the selected run. 
              Uploading a new video will replace the existing clip.
            </AlertDescription>
          </Alert>
        )} */}

        {/* Clips Status Display */}

        <form className="space-y-4">
          <FormField
            control={form.control}
            name="athlete"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Athlete</FormLabel>
                <Combobox
                  data={athletesData}
                  value={field.value}
                  onSelect={(val) => form.setValue("athlete", val as number)}
                  itemLabel="athlete"
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="run"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Run</FormLabel>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        size="lg"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? runsData.find((item) => item.value === field.value)
                              ?.label
                          : "Select runs"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                    <Command>
                      <CommandInput
                        placeholder={`Search runs...`}
                        className="h-12"
                      />
                      <CommandList>
                        <div className="px-1 py-2">
                          <Button
                            className="w-full"
                            onClick={handleCreateRunClicked}
                          >
                            <Plus />
                            Create new run instead
                          </Button>
                        </div>
                        <hr className="mb-2" />
                        <CommandEmpty>No runs found.</CommandEmpty>
                        <CommandGroup>
                          {runsData.map((item) => (
                            <CommandItem
                              disabled={!item.active}
                              value={item.value.toString()}
                              key={item.label}
                              onSelect={(val) => {
                                console.log(val);
                                form.setValue("run", parseInt(val));
                                setComboboxOpen(false);
                              }}
                            >
                              {item.label}{" "}
                              {!item.active && <Upload color="green" />}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  item.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="video"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video</FormLabel>
                <FormControl>
                  <FilePond
                    allowRevert={false}
                    allowRemove={false}
                    disabled={selectedRunId === undefined}
                    files={field.value && [field.value]}
                    onupdatefiles={(files) => {
                      if (files) {
                        form.setValue("video", files[0].file as File);
                        form.clearErrors();
                      }
                    }}
                    server={{
                      process: async (
                        _fieldName,
                        file,
                        _metadata,
                        load,
                        error,
                        progress,
                        _abort,
                      ) => {
                        try {
                          const baseUrl = `/api/runs/${selectedRunId}/clips/${turnId}/upload`;

                          // Step 1: Create multipart upload
                          const createResponse = await fetch(
                            `${baseUrl}?action=mpu-create`,
                            {
                              method: "POST",
                            },
                          );

                          if (!createResponse.ok) {
                            error("Failed to create multipart upload");
                          }

                          const { uploadId } =
                            (await createResponse.json()) as {
                              key: string;
                              uploadId: string;
                            };

                          // Step 2: Upload file in chunks
                          const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks
                          const totalParts = Math.ceil(file.size / CHUNK_SIZE);
                          const uploadedParts: Array<{
                            partNumber: number;
                            etag: string;
                          }> = [];

                          for (
                            let partNumber = 1;
                            partNumber <= totalParts;
                            partNumber++
                          ) {
                            const start = (partNumber - 1) * CHUNK_SIZE;
                            const end = Math.min(start + CHUNK_SIZE, file.size);
                            const chunk = file.slice(start, end);

                            const partResponse = await fetch(
                              `${baseUrl}?action=mpu-uploadpart&uploadId=${uploadId}&partNumber=${partNumber}`,
                              {
                                method: "PUT",
                                body: chunk,
                              },
                            );

                            if (!partResponse.ok) {
                              error(`Failed to upload part ${partNumber}`);
                            }

                            const partResult = (await partResponse.json()) as {
                              etag: string;
                            };
                            uploadedParts.push({
                              partNumber,
                              etag: partResult.etag,
                            });
                            progress(true, partNumber, totalParts);
                          }

                          // Step 3: Complete multipart upload
                          const completeResponse = await fetch(
                            `${baseUrl}?action=mpu-complete&uploadId=${uploadId}`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                parts: uploadedParts,
                              }),
                            },
                          );

                          if (!completeResponse.ok) {
                            error("Failed to complete multipart upload");
                          }

                          const result = await completeResponse.json();
                          console.log("Upload completed:", result);

                          load(uploadId);
                          setShowSuccessMsg(true);
                        } catch (err) {
                          error(String(err));
                        }
                      },
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
          <div className="flex gap-2">
            <Button
              type="button"
              size="lg"
              className="flex-1"
              variant="outline"
              onClick={() => {
                form.reset();
                setShowSuccessMsg(false);
              }}
            >
              Clear Form
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              variant="secondary"
              onClick={() =>
                navigate(`/upload/trailandturn?${searchParams.toString()}`)
              }
            >
              Back
            </Button>
          </div>
        </form>
        {showSuccessMsg && (
          <div className="rounded-md ring ring-green-500 bg-green-500/10 text-green-700 p-2 text-center">
            Successfully uploaded!
          </div>
        )}
      </Form>
    </Layout>
  );
}

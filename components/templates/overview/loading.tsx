import { Skeleton } from "@/components/ui/skeleton";

const OverviewLoading = () => {
  return (
    <>
      <div className="w-full flex justify-end my-4">
        <Skeleton className="w-24 h-8" />
      </div>
      <div className="w-full grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton
            key={i}
            className="flex flex-col justify-between p-4 text-white rounded-md aspect-square"
          />
        ))}
      </div>
    </>
  );
};

export default OverviewLoading;

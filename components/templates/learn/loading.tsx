import { Skeleton } from "@/components/ui/skeleton"

const LearnDeckLoading = () => (
    <div className="w-full h-full">
        <Skeleton
            className="max-w-sm rounded-xl mx-auto my-10 p-5 aspect-square"
        />
        <div className="max-w-md mx-auto flex justify-between">
            <Skeleton
                className="w-16 h-16" />
            <Skeleton
                className="w-16 h-16" />
        </div>
    </div>
);

export default LearnDeckLoading;
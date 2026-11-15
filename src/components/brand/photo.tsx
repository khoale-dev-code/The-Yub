import Image from "next/image";
import type { StoryPhoto } from "@/lib/story-images";

interface PhotoProps {
  photo: StoryPhoto;
  sizes: string;
  className?: string;
  /** Bo goc anh */
  rounded?: string;
  /** Hieu ung "mo man" khi cuon toi (clip-path + zoom nhe) */
  reveal?: boolean;
  priority?: boolean;
  caption?: string;
}

/**
 * Anh hien thi DUNG TI LE GOC (khong object-cover, khong cat).
 * Chieu cao tu suy ra tu width/height that cua anh.
 */
export function Photo({ photo, sizes, className = "", rounded = "rounded-[22px]", reveal = true, priority = false, caption }: PhotoProps) {
  const img = (
    <div {...(reveal ? { "data-reveal-image": "" } : {})} className={`overflow-hidden ${rounded}`}>
      <Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} sizes={sizes} priority={priority} className="block h-auto w-full" />
    </div>
  );
  if (!caption) return <div className={className}>{img}</div>;
  return (
    <figure className={`m-0 flex flex-col gap-2.5 ${className}`}>
      {img}
      <figcaption className="text-[13px] text-muted-2">{caption}</figcaption>
    </figure>
  );
}

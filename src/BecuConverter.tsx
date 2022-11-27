import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const readFileAsync = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = reject;

    reader.readAsText(file);
  });
};

const DragArea = (props: { onDrop: (files: File[]) => void }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: props.onDrop,
  });

  const dragClasses = useCallback(() => {
    let classes = "drag-area";

    if (isDragActive) {
      classes += " drag-area--focused";
    }

    return classes;
  }, [isDragActive]);

  return (
    <div
      className={dragClasses()}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <p>drag your file here to upload</p>
    </div>
  );
};

type CategoryGroup = {
  name: string;
  items: LineItem[];
};

type ParentGroup = {
  name: string;
  categories: CategoryGroup[];
};

type LineItem = {
  date: string;
  description: string;
  original: string;
  amount: number;
  type: string;
  parent: string;
  category: string;
};

const parseCSV = (csvString: string) => {
  const lines = csvString.split("\n");
  lines.shift(); // remove header row

  const data = lines.map((line) => line.split(",").map((row) => row.trim()));

  const dataItems: LineItem[] = data.map((item) => ({
    date: item[0],
    description: item[1],
    original: item[2],
    amount: Number.parseFloat(item[3]),
    type: item[4],
    parent: item[5],
    category: item[6],
  }));

  const parents: ParentGroup[] = [];
  dataItems.forEach((item) => {
    const parent = item.parent;
    let parentGroup = parents.find((p) => p.name === parent);

    if (parentGroup === undefined) {
      parentGroup = { name: parent, categories: [] };
      parents.push(parentGroup);
    }

    const category = item.category;
    let categoryGroup = parentGroup.categories.find((c) => c.name === category);

    if (categoryGroup === undefined) {
      categoryGroup = { name: category, items: [] };
      parentGroup.categories.push(categoryGroup);
    }

    categoryGroup.items.push(item);
  });

  return parents;
};

const createDownload = (parents: ParentGroup[]) => {
  const lines: string[][] = [];

  parents.forEach((p) => {
    lines.push(["Parent Category", p.name]);
    let parentTotal = 0;
    p.categories.forEach((c) => {
      lines.push(["Category", c.name]);
      c.items.forEach((i) =>
        lines.push(Object.values(i).map((v) => v.toString()))
      );
      const catTotal = c.items
        .map((i) => i.amount)
        .reduce((prev, current) => prev + current, 0);
      lines.push(["", "", "Category Total", catTotal.toFixed(2)]);
      lines.push([]);
      parentTotal += catTotal;
    });
    lines.push(["", "", "Parent Total", parentTotal.toFixed(2)]);
    lines.push([]);
    lines.push([]);
  });

  return lines;
};

const toCSV = (data: string[][]) =>
  data.map((line) => line.join(",")).join("\n");

export const BecuConverter = () => {
  const [downloadUrl, setDownloadUrl] = useState<string>();

  return (
    <>
      <h1>BECU CSV Converter</h1>
      <DragArea
        onDrop={async (files: File[]) => {
          if (files.length !== 1) {
            alert("only one file may be uploaded at a time");
            return;
          }

          const file = files[0];
          const data = await readFileAsync(file);

          const parentCategories = parseCSV(data);
          const downloadData = createDownload(parentCategories);

          const b = new Blob([toCSV(downloadData)], { type: "text/csv" });
          setDownloadUrl(URL.createObjectURL(b));
        }}
      />
      {downloadUrl && (
        <>
          <h2>
            Done processing!{" "}
            <a download href={downloadUrl}>
              Click here to download
            </a>
            .
          </h2>
        </>
      )}
    </>
  );
};

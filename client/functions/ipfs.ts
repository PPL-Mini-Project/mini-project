const uploadFiles = async (acceptedFiles: FileList,upload: (data: { data: File[]; options?: object }) => Promise<string[]>) => {
  const documents = await upload({
    data: Array.from(acceptedFiles),
    options: {
      uploadWithGatewayUrl: true
    },
  });
  return documents;
};

export { uploadFiles };

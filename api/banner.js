import {
  getBanners
} from "./sheet.js";

import {
  handleOptions,
  sendError,
  setCommonHeaders
} from "./_utils.js";

export default async function handler(
  req,
  res
) {

  if (
    handleOptions(
      req,
      res
    )
  ) {
    return;
  }

  try {

    const banners =
      await getBanners();

    setCommonHeaders(
      res,
      {
        cache: "no-store"
      }
    );

    return res
      .status(200)
      .json({

        success: true,

        count:
          banners.length,

        banners

      });

  } catch (error) {

    console.error(
      error
    );

    return sendError(
      res,
      502,
      "Unable to read banners sheet"
    );
  }
}

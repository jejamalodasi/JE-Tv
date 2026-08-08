import {
  getChannels
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

    const channels =
      await getChannels();

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
          channels.length,

        channels

      });

  } catch (error) {

    console.error(
      error
    );

    return sendError(
      res,
      502,
      "Unable to read Google Sheet"
    );
  }
}

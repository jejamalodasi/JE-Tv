import {
  getChannels
} from "./sheet.js";

import {
  getQuery,
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

    const query =
      String(
        getQuery(
          req,
          "q"
        ) || ""
      )
        .trim()
        .toLowerCase();

    const channels =
      await getChannels();

    const results =
      !query
        ? channels
        : channels.filter(
            channel =>
              [
                channel.Name,
                channel.name,
                channel.Group,
                channel.group,
                channel.Language,
                channel.language,
                channel.Country,
                channel.country
              ]
                .filter(Boolean)
                .some(
                  value =>
                    String(value)
                      .toLowerCase()
                      .includes(query)
                )
          );

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
          results.length,

        channels:
          results

      });

  } catch (error) {

    console.error(
      error
    );

    return sendError(
      res,
      502,
      "Unable to search channels"
    );
  }
}

import * as params from "./params";

/**
 * Heuristically determine flag's value range based on flag's default value.
 *
 * Assume that the flag's default value has already chosen the best option for
 * the runtime environment, so users can only tune the flag value downwards.
 *
 * For example, if the default value of `WEBGL_RENDER_FLOAT32_CAPABLE` is false,
 * the tunable range is [false]; otherwise, the tunable range is [true. false].
 *
 * @param {string} flag
 */
function getTunableRange(flag) {
  if (flag === "WEBGL_FORCE_F16_TEXTURES") {
    return false;
  } else if (flag === "WEBGL_CPU_FORWARD") {
    return true;
  } else if (flag === "WEBGL_PACK") {
    return true;
  } else if (flag === "WEBGL_VERSION") {
    return 2;
  } else if (flag === "WEBGL_FLUSH_THRESHOLD") {
    return -1;
  } else if (flag === "WEBGL_RENDER_FLOAT32_CAPABLE") {
    return true;
  } else {
    return null;
  }
}

/**
 *
 * @param {string} backendName
 */
export function changeBackendFlag(backendName) {
  const flags = {};
  const tunableFlags = params.BACKEND_FLAGS_MAP[backendName];
  for (let index = 0; index < tunableFlags.length; index++) {
    const flag = tunableFlags[index];

    // When tunable (bool) and range (array) attributes of `flagRegistry` is
    // implemented, we can apply them to here.
    const flagValueRange = getTunableRange(flag);
    // Heuristically consider a flag with at least two options as tunable.
    if (flagValueRange.length < 2) {
      console.warn(
        `The ${flag} is considered as untunable, ` +
          `because its value range is [${flagValueRange}].`
      );
      continue;
    }
    flags[flag] = flagValueRange;
  }
  return flags;
}

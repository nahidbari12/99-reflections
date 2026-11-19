export function scoreCanvasPixels(guidePixels, userPixels, width, height, radius = 9) {
  if (!guidePixels?.data || !userPixels?.data || !width || !height) {
    return { score: 0, precision: 0, coverage: 0, hasEnoughInk: false };
  }
  const guide = guidePixels.data;
  const user = userPixels.data;
  const guideMask = new Uint8Array(width * height);
  const userMask = new Uint8Array(width * height);
  let guideCount = 0;
  let userCount = 0;

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    if (guide[offset + 3] > 20) {
      guideMask[index] = 1;
      guideCount += 1;
    }
    if (user[offset + 3] > 20) {
      userMask[index] = 1;
      userCount += 1;
    }
  }

  if (userCount < 70 || guideCount < 70) {
    return { score: 0, precision: 0, coverage: 0, hasEnoughInk: false };
  }

  const near = (mask, x, y, searchRadius) => {
    const minX = Math.max(0, x - searchRadius);
    const maxX = Math.min(width - 1, x + searchRadius);
    const minY = Math.max(0, y - searchRadius);
    const maxY = Math.min(height - 1, y + searchRadius);
    for (let yy = minY; yy <= maxY; yy += 2) {
      for (let xx = minX; xx <= maxX; xx += 2) {
        if (mask[yy * width + xx]) return true;
      }
    }
    return false;
  };

  let userNearGuide = 0;
  let sampledUser = 0;
  let guideNearUser = 0;
  let sampledGuide = 0;
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const index = y * width + x;
      if (userMask[index]) {
        sampledUser += 1;
        if (near(guideMask, x, y, radius)) userNearGuide += 1;
      }
      if (guideMask[index]) {
        sampledGuide += 1;
        if (near(userMask, x, y, radius + 3)) guideNearUser += 1;
      }
    }
  }

  const precision = sampledUser ? userNearGuide / sampledUser : 0;
  const coverage = sampledGuide ? guideNearUser / sampledGuide : 0;
  const score = Math.max(0, Math.min(100, Math.round((precision * 0.62 + coverage * 0.38) * 100)));
  return {
    score,
    precision: Math.round(precision * 100),
    coverage: Math.round(coverage * 100),
    hasEnoughInk: true,
  };
}

export function feedbackForScore(result, mode = "trace") {
  if (!result?.hasEnoughInk) {
    return { tone: "try", title: "Keep going", message: "Finish the letter before checking your writing." };
  }
  if (result.score >= 85) {
    return { tone: "great", title: "Excellent writing", message: "Your shape follows the letter beautifully." };
  }
  if (result.score >= (mode === "write" ? 48 : 58)) {
    return { tone: "good", title: "Nice work", message: "You captured the letter. One more attempt can make it even stronger." };
  }
  if (result.precision < 45) {
    return { tone: "try", title: "Almost there", message: "Keep your writing closer to the letter shape." };
  }
  return { tone: "try", title: "Complete the shape", message: "Some parts of the letter are still missing. Use Show Me and try again." };
}


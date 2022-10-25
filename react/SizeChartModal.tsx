import React, { useEffect, useMemo, useRef, useState } from "react";
import { canUseDOM } from "vtex.render-runtime";

import styles from "./styles.css";

interface SizeChartModalProps {

}

const SizeChartModal: StorefrontFunctionComponent<SizeChartModalProps> = ({ }) => {

  return (<>Hello World</>);
}

SizeChartModal.schema = {
  title: "Size Chart Modal",
  type: "object",
  properties: {

  }
}

export default SizeChartModal;
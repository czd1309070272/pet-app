import os
from mistralai import Mistral
from pathlib import Path
import base64
class OCRService:
    def __init__(self):
        self.api_key = os.getenv("MISTRAL_API_KEY")  # 或直接填 "你的key"
        if not self.api_key:
            self.api_key = "1YFis4r23UcZaFl6PT5bQystJGy52MQm"
    def ocr_image(self, base64_image):
        client = Mistral(api_key=self.api_key)
        response = client.ocr.process(
            model="mistral-ocr-latest",          # 或試 "mistral-ocr-2512"
            document={
                "type": "image_url",
                "image_url": base64_image  # jpeg 或 png 都可以
            },
            include_image_base64=False,          # 如果不需要回傳切割出的小圖就設 False
            # table_format="html"                # 如果有表格想用 html 格式可開啟
        )
        return response
        
ocr=OCRService()
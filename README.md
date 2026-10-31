# yerim-easy

GPT Image API로 이미지를 생성하는 CLI (Node 18+, 의존성 없음).

## 설정
```bash
cp .env.example .env   # OPENAI_API_KEY 입력
```

## 사용
```bash
node generate.mjs "푸른 숲속의 작은 오두막, 수채화" --size 1024x1024 --quality high --n 2
```
결과는 `images/` 폴더에 PNG로 저장됩니다. 모델은 기본 `gpt-image-2`이며 `--model` 또는 `OPENAI_IMAGE_MODEL`로 바꿀 수 있습니다.

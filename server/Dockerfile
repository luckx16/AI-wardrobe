FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./

# Системный libvips здесь не нужен: sharp ставит собственную сборку
# (@img/sharp-libvips-linux-x64), и она умеет HEIF — фото с айфонов читаются.
# Раньше стояли libvips-dev и libheif-dev вместе с SHARP_FORCE_GLOBAL_LIBVIPS=1,
# но переменная не срабатывала (npm всё равно ставил готовые бинарники), а
# заголовочные пакеты тянули libicu-dev, libx265-dev, libhdf5-dev и весили 512 МБ впустую.
#
# Дальше выбрасываем то, что не нужно этой платформе:
#   - провайдер CUDA у onnxruntime-node весит 480 МБ и бесполезен без видеокарты,
#     tensorrt — туда же; darwin и win32 — бинарники под чужие ОС.
#     Остаются libonnxruntime.so, onnxruntime_binding.node и пустой
#     providers_shared.so, на который есть ссылки.
#   - образ собран на glibc, поэтому сборки sharp под musl и wasm не используются.
RUN npm ci --omit=dev \
 && npm cache clean --force \
 && rm -rf node_modules/onnxruntime-node/bin/napi-v3/darwin \
           node_modules/onnxruntime-node/bin/napi-v3/win32 \
           node_modules/@img/sharp-libvips-linuxmusl-x64 \
           node_modules/@img/sharp-linuxmusl-x64 \
           node_modules/@img/sharp-wasm32 \
 && rm -f node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_cuda.so \
          node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_tensorrt.so

COPY . .

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "./src/app.js"]

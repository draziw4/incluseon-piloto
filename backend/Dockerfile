FROM python:3.12-slim
#não criar qruivos de cache e faz os logs aparecem imediatamente.
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

#estou criando uma pasta app e trabalhando dentro dessa pasta
WORKDIR /app

#copio o arquivo requirementes para app/requirements ou seja arquivo - path
COPY requirements.txt ./requirements.txt
# faço a instalaçao das dependencias necessárias, e peço para não salvar o cache dos pacotes baixados
RUN pip install --no-cache-dir -r requirements.txt
# copio backend para a pasta app

COPY backend ./backend
RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /data/reports \
    && chown -R appuser:appuser /app /data/reports
# começo a trabalhar na pasta app/backend como se fosse um cd /app/backend
WORKDIR /app/backend
#defino a porta que o meu container trabalha
EXPOSE 8000
USER appuser

#rodo esses códigos no meu cmd
# uvicorn é o servidos, main:app é o arquivo, defino o host para que o servidor aceite conexoes de fora do container e defino que a aplicacao vai rodar na porta 8000, headers faz o Uvicorn confiar em headers enviados por proxies.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]

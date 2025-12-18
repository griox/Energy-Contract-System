FROM datalust/seq:2024.1

# Chuyển quyền root
USER root

# Biến môi trường
ENV ACCEPT_EULA="Y"

# 👇 SỬA DÒNG NÀY: Bỏ chữ "/bin" đi
ENTRYPOINT ["/seqsvr/Seq", "run"]
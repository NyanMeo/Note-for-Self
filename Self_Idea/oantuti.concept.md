## Concept game oẳn tù tì

- Game đối kháng 2 người chơi
- Mỗi lượt chơi được 5s để lựa chọn phương thức và chốt
- Có 3 phương thức
  * Nạp đạn
  * Bắn
  * Khiên (đỡ đạn)
- Bắt buộc phải nạp nếu muốn bắn
- Nạp đạn là thời điểm duy nhất có thể chết
- Sau 5 lần nạp đạn, phát bắn tiếp theo sẽ xuyên khiên
- Nếu cả hai cùng bắn (đều có đạn), ai nạp nhiều hơn sẽ thắng. Nếu số đạn bằng nhau thì được tính là hoà và chơi tiếp.
- Trò chơi có 2 chế độ
  * Đánh thường: không có thời gian tổng, hoàn toàn có thể khiên đến hết game
  * Đánh thời gian: có thời gian tổng, ai hết thời gian tổng trước thì thua
- Để tránh sử dụng khiên liên tục, sẽ bổ sung thêm luật không được khiên liên tục 5 lần liên tiếp

## Giao diện

- Có 3 nút tương ứng với 3 phương thức, bên cạnh là nút chốt/huỷ
- Có số đạn ở góc phải để đo số lần nạp của mình. Số lần nạp của đối phương, người chơi phải tự nhớ
- Người chơi chỉ có duy nhất 1 máu
- Thời gian ở góc trên chính giữa

## Hướng làm

- Phát triển trên giao diện web
- Dùng html5 (Vue, React...)
- Dùng socketIO để chơi nhiều người
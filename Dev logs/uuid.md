# Hôm nay tôi dùng UUID (hay cách tối ưu Primary Key trong SQL)

## Tản mạn

Tôi biết đến UUID trong lúc đọc blog kĩ thuật, một số bài tôi sẽ đưa vào phần tham khảo. Nhưng cho tới trước thời điểm viết bài này, tôi vẫn chưa bao giờ động tay vào làm việc với nó. Lý do ấy hả? Ờm thì mấy con ứng dụng quản lý thông thường của doanh nghiệp nhà nước thì cần gì phải phức tạp hoá vấn đề đến thế. Ứng dụng vẽ mây vẽ vượn ra 200 chức năng nhưng chức năng nào cũng không nặng về nghiệp vụ hơn là thiết kế cơ sở dữ liệu. À thôi không bàn về vụ đó ở đây.

Cho tới mãi gần đây, đúng hơn là 2 tuần vừa rồi. Tôi nhận 1 công việc xây dựng ứng dụng kết nối hệ thống máy chấm công cho một bên X. Nghe thì đơn giản quá xá, mà đến khi chạm tay vào thì mới biết là phải dùng UUID.

Cụ thể công việc tôi nhận có 2 phần:

1. Ứng dụng so khớp thông tin thẻ và nhân viên (cái này siêu dễ, tần suất sử dụng không cao, ít phải tối ưu, chỉ phải đảm bảo UI/UX thôi)
2. Ứng dụng đứng giữa gửi thông tin từ máy chấm công lên máy chủ (đây là thằng phải tối ưu nhiều)

Giờ tôi sẽ mô tả chi tiết về cái ứng dụng thứ 2.

## Bài toán

Đơn vị X có 2000 nhân viên. Mỗi ngày nhân viên quẹt thẻ ra/vào ít nhất 2 lần (có vài ông hay đi đu đưa nên quẹt nhiều hơn, nhưng trường hợp đó không nhiều). Vị chi máy chấm công sẽ nhận vào 5000 bản ghi mỗi ngày.

Ứng dụng sẽ làm 2 việc:

1. Đọc dữ liệu từ Database của máy chấm công
2. Gửi dữ liệu đọc được lên server để đánh dấu

Về cơ sở vật chất: đơn vị X đảm bảo sẽ cho tôi một con máy tính, nhưng không đảm bảo nó có khoẻ hay không, và như tôi kiểm tra hôm đầu tuần thì đó là một em Pentium với 2gb RAM, và đường truyền rất hay mất ổn định, đến nỗi người ta còn sẵn sàng cắm thêm USB 3G.

Thôi giới thiệu thế này thôi, đi vào giải quyết bài toán nào.

## Giải quyết

Nếu bạn đọc sơ qua thì có thể thấy đây chỉ là một bài toán Message Queue bình thường. Việc bạn cần làm là lấy dữ liệu ra, đẩy vào hàng đợi, rồi lấy dữ liệu từ hàng đợi để gửi đi. Song, như đã viết về cơ sở vật chất nghèo nàn của đơn vị X, tôi không dám để nó vào hàng đợi ảo trên code, nhỡ mất điện hay chó đái vào ổ cắm thì đỡ thế nào được. 

Ngoài ra, tôi không muốn (không được phép) rờ mó vào Database của bên máy chấm công, trừ việc đọc dữ liệu từ nó, nên tôi sẽ phải viết ra DB riêng để làm việc, và may sao cả DB của tôi lẫn của máy đều được cài cùng thiết bị, thành ra tốc độ truy vấn giữa hai thằng khỏi phải lo. DB của tôi sẽ có dạng như bảng dưới:

Tên | Kiểu dữ liệu | Ý nghĩa
--- | --- | ---
id | bigint | Primary Key, tự tăng
userId | varchar(36) | id của người dùng, cái này do ứng dụng khác lo
time | datetime | Thời gian quẹt thẻ
status | bit | Dùng để kiểm tra xem bản ghi đã được gửi đi hay chưa
minutes | int | Dùng để tính số phút nhằm tìm chênh lệch

Vì ứng dụng phải làm 2 việc là đọc và gửi dữ liệu, nên tôi sẽ chia thành:

- `ReaderBot`: đọc dữ liệu từ bảng chấm công & ghi lại dữ liệu vào bảng của tôi
- `SenderBot`: đọc dữ liệu từ bảng của tôi & đẩy lên server & kiểm tra điều kiện để còn gửi lại

### ReaderBot

Để đảm bảo việc đọc dữ liệu không bị trùng những dữ liệu trước đó - không ông nhân viên nào được ghi nhận công sức quá 1 lần - tôi cần một mốc thời gian cho máy đọc. Giờ làm sao xác định được mốc thời gian này nhỉ? À ứng dụng của tôi sẽ khởi động hàng ngày lúc 4 giờ sáng, oke, một mốc. Cơ mà tôi không thể bấu víu vào mỗi cái 4h sáng đấy được. Thế thì tôi sẽ phải kiểm tra xem bản ghi có thời gian gần nhất trong bảng của tôi trả về gì.

```
curDate = DateTime.Now
timePeriod = "select top (1) time from AntCheckinout order by time desc"
if (!timePeriod) timePeriod = new Date(curDate.Year, curDate.Month, curDate.Day, 4, 0, 0)
```

Oke, vậy là tôi đã có mốc thời gian, giờ đến lượt truy vấn để lấy dữ liệu checkinout từ máy chấm công của bên đối tác rồi. Trung bình mỗi người sẽ quẹt thẻ của họ trong 2s, và ở đó có 4 máy, tức là cứ 2s có 4 người quẹt, vậy thì tầm khoảng 30s sẽ có 60 người quẹt. Vậy thì cộng thêm mấy ông thích quẹt nhiều lần vào là cỡ 100 bản ghi là khá thoải mái. Sau khi lấy ra xong thì lấy bản ghi cuối cùng, nếu có, để cập nhật lại mốc thời gian rồi duyệt tiếp.

```
machineData = $"select top (100) userCode, time from MachineCheckinout where time > '{timePeriod}'"
// chọc ngoáy machineData
if (machineData.Any()) timePeriod = machineData.LastOrDefault().time
```

Giờ đến đoạn ghi dữ liệu vào bản ghi, cũng như lọc mấy thằng cha ma giáo thích quẹt nhiều phát liên tiếp. Lúc này tôi quyết định so sánh giờ phút của bản ghi mới với bản ghi đã được đẩy vào bảng của mình. Cụ thể, nếu bản mới có time lệch so với bản cũ 2 phút thì ghi, thế là mấy thằng quẹt 10 nháy liên tiếp trong 1p chỉ có móm nhé.

```
foreach(data in machineData) {
  data.minutes = data.time.hour * 60 + data.time.minute
  oldData = "select top (1) time from AntCheckinout where userCode = {data.userCode} order by time desc"
  if (data.minutes + 120 <= oldData) AntCheckinout.Insert(data)
}
```

Và đây chính là một pha gây nút cổ chai điển hình. Tôi sẽ giải thích rõ hơn về lý do tại sao đoạn này trong phần Tối ưu.

### SenderBot

Nếu cần gửi dữ liệu lên server thì chỉ vài câu GET/POST là xong. Sau khi gửi xong nếu trả về HTTP 200 thì cập nhật lại, còn không thì để dành đó cho lần gửi tiếp theo.

```
response = post(params)
if (response.httpCode == 200) AntCheckinout.Update(status)
```

Còn phần khó là lấy dữ liệu ra cơ, và kết hợp với phần trên tạo thành 2 cái cổ chai to đùng mà cứ 30s ứng dụng lại dính.

```
antData = "select * from AntCheckinout where status = 0"
```

## Tối ưu

Giờ tôi sẽ giải thích lý do vì sao các lệnh trên tạo thành nút cổ chai. Thứ nhất là cách tổ chức dữ liệu trong cơ sở dữ liệu quan hệ nói chung và SQL server nói riêng đều sẽ thực hiện quét toàn bộ bảng nếu không truy vấn trên chỉ mục - index. Tức là, nếu bạn chọn chạy `select * from AntCheckinout where status = 0` thì SQL Server sẽ quét toàn bộ bảng `AntCheckinout`, sau đó lọc ra những bản ghi có `status = 0` rồi trả kết quả về cho bạn.

Như đã đề cập ở phần Bài toán, mỗi ngày có ít nhất 5000 lượt quẹt. Sau 10 ngày, ta sẽ có cỡ 50.000 lượt, sau tầm 3 tháng là gần 500.000 bản ghi. Và con ứng dụng của tôi phải chạy 30s/lần từ 4h sáng đến 23h đêm, tức là cứ mỗi phút nó quét bảng 2 lần. Chưa kể với hàm phần so khớp trong SenderBot để tìm ra bản ghi cuối cùng sẽ làm số lần quét bảng lên tới 3 nháy. Tất nhiên không bỏ qua giai đoạn đầu tiên khi bật ứng dụng lên để lấy thời gian, tuy nhiên mốc thời gian chỉ được xác định một lần duy nhất nên có thể coi như nó không gây ảnh hưởng quá nhiều. Và cuối cùng, phần cứng không đủ, mạng không đủ, vì vậy giờ ta sẽ phải tối ưu lại chút.

Trước khi đi vào tối ưu, tôi đã nghĩ đến việc đánh thêm index cho các trường thông tin phải truy xuất nhiều để tăng tốc. Song có một loại index khá là hay ho, mà lại được đề nghị nên dùng, chính là Primary Key (PK). PK là khoá, đảm bảo yếu tố duy nhất, và được bộ Optimizer của mọi cơ sở dữ liệu quan hệ tối ưu cho bét nhè về tốc độ. Vậy thì giờ ta sẽ tạo ra PK cho `AntCheckinout` thay cho cái đống số tự tăng vô nghĩa.

Câu hỏi đặt ra, tạo PK như thế nào bây giờ? Trước đấy tôi đọc về đủ thứ, nào là lệch bit trái, lệch bit phải. Rồi cuối cùng đưa ra một cách làm tương đối đơn giản, và mỗi khi đọc dữ liệu sẽ chỉ cần cắt chuỗi (substring).

```
id = date + userCode + time_checkinout
```

PK `id` sẽ được tạo thành từ date dưới dạng năm-tháng-ngày (`yyyyMMdd`), tiếp tới là mã người dùng, vốn là duy nhất trong đơn vị X, và cuối cùng là số lần quẹt thẻ. PK này thể hiện: vào ngày X tháng Y năm Z, nhân viên có số hiệu AAAAA, đã quẹt thẻ lần thứ N. Mỗi lần cậu nhân viên AAAAA quẹt thẻ, tôi lại kiểm tra điều kiện và tăng số N lên, và thế là bảng `AntCheckinout` sẽ luôn có PK duy nhất.

Giờ ta sẽ áp dụng PK này vào từng đoạn code để tối ưu nhé:

### Lấy mốc thời gian

```
curDate = DateTime.Now
timePeriod = $"select top (1) time from AntCheckinout where id like '{curDate:"yyyyMMdd"}%' order by time desc"
```

Với câu truy vấn như này, số bản ghi phải so sánh sẽ chỉ được lấy khi id có phần thời gian phía trước. Vậy tức là nếu lấy theo ngày, tôi sẽ chỉ phải quét cỡ 5k bản ghi so với 500k bản ghi sau khi triển khai phần mềm được 3 tháng.

### Readerbot

Với phần đọc và ghi dữ liệu từ bảng của máy đọc, tôi vẫn áp dụng việc xử lý trên PK, nhưng thay đổi một chút với tham số `time_inout`. Cụ thể, tôi sẽ lắp ráp ra id từ những dữ liệu lấy từ bảng của máy chấm công - với một số hàm cơ bản trong SQL để xử lý chuỗi và datetime. Rồi chạy một vòng lặp nhằm tăng số `time_inout` lên cho tới khi lấy được bản ghi cuối cùng trong bảng riêng của mình. Mọi sự so sánh đều được sử dụng là so sánh `=`, khác với like, khi dùng trên PK đạt tốc độ cao nhất, nên dù là có so sánh đến lần thứ 90 thì vẫn cứ là nhanh.

```
void CheckInsert(curData) {
  oldData = $"select top (1) from AntCheckinout where id = '{curData.id}0'"
  if (oldData != null) {
    times = 0
    while (oldData) {
      ++times
      oldData = $"select top (1) from AntCheckinout where id = '{curData.id + times}'"
    }
    if (oldData.minutes + 120 <= curData.minutes) {
      curData.id = curData.id + times
      AntCheckinout.Insert(curData)
    }
  }
  curData.id = curData.id + times
  AntCheckinout.Insert(curData)
}
```

Tất nhiên để làm cho Optimizer chạy filter tốt nhất, thì bạn nên sắp xếp sao cho id thẳng tắp, ví dụ:

```
xxxxx00
xxxxx01
xxxxx10
xxxxx11
```

Như vậy thì bạn sẽ phải viết thêm một hàm nào đó, đánh số cho `times` nếu nó nhỏ hơn 0. Nhưng tôi nghĩ cái đó nhiều người làm lắm rồi

### SenderBot

Nhờ ứng dụng thành công trong khâu nhập liệu, giờ ta chỉ cần gặt hái thành quả thôi. Đối với thằng gửi dữ liệu lên API chấm công, nó chỉ cần đọc ra dữ liệu của ngày hôm nay (vì chả hơi đâu đi chấm cho thằng nào ở quá khứ), và riêng phần này thì thằng khoá chính đã giải quyết thay mình rồi. Chỉ cần thêm chút kiểm tra trên khoá chính là xong.

```
curDate = DateTime.Now
antData = $"select * from AntCheckinout where id like '{curDate:"yyyyMMdd"}%' and status = 0"
```

## Hơn thế nữa

Tất cả đoạn code trên đều chạy theo dạng đồng bộ (Sync), nếu làm bất đồng bộ thì còn nhanh hơn nữa (tôi đoán thế). Song, do thời gian không có nhiều, tôi vẫn chưa thể làm được, nếu bạn có cách nào hay hơn thì hãy chia sẻ cho tôi biết nhé. Hoặc nếu tôi có làm gì sai trái, làm ơn chỉ ra cho tôi nhé.

## Tham khảo

- [UUID cho cách mạng 4.0](https://kipalog.com/posts/UUID-cho-cach-mang-4-0)
- [Instagram đã sinh ra ID trong database của họ như thế nào](https://nghethuatcoding.com/2019/05/19/instagram-da-sinh-ra-id-trong-database-cua-ho-nhu-the-nao/)
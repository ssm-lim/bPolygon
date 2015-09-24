네이버 부동산(http://land.naver.com/)에 있는 Map같이 행정구역 경계 단위를 표시하는 것을 다음 map Api로 구현했습니다.

#dmap_event
- api에서 제공하는 addListener로 이벤트 처리.
- 마무리 버전.

# dmap_cls_event 
- class 지정으로 이벤트 처리. 
- 만들었다가 사용할 수 없어서 별도의 주석은 달지 않았지만 dmap_event와 큰 차이는 없습니다.

# highmaps
- highmap을 이용하여 만들었으며 클릭시 지역이 확대되는 기능이 있음.
- 그 외의 기능 없음. 그냥 예제 가져다가 geojson만 바꿨음.


행정구역 경계 데이터 - http://www.gisdeveloper.co.kr/979/
다음 API - http://apis.map.daum.net/
개발시 참고 - http://nickyv.tistory.com/15/

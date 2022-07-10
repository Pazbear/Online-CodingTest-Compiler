package problems.problem1;
public class code
{
	public static void main(String[] args) {
	    int[][] problems = {{1,2,3,4},{1,2,7,6,4}};
		int[] answers = {1,4};
		int right_cnt=0;
		Solution s = new Solution();
		for(int i=0; i<problems.length; i++){
			if(s.solution(problems[i]) == answers[i]) right_cnt++;
		}
		System.out.println("[valid data]success: "+right_cnt+ " / failed:"+(problems.length-right_cnt));
	}
}

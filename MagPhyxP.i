/* magphyxp.i */
 %module magphyxp
 %{
 /* Put header files here or function declarations like below */
 extern double period(double ptheta, double pphi, int num_events, double energy);
 %}
 
 extern double period(double ptheta, double pphi, int num_events, double energy);
